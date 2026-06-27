const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { defineSecret } = require('firebase-functions/params');
const webpush = require('web-push');

const webPushPrivateKey = defineSecret('WEB_PUSH_PRIVATE_KEY');
const webPushPublicKey = 'BA9U0D5hD7CAFBz4dg8NFqzUmKX5wtJZbOznbJlc_wKPdBmQ2Co2tGvMsZevOJXs3BfE73a2BUuhEfvtP5qB-us';

initializeApp();

function taskMap(tasks = []) {
  return new Map(tasks.map(task => [String(task.id), task]));
}

async function sendPush(tokens, subscriptions, title, body, tag, url) {
  const uniqueTokens = [...new Set((tokens || []).filter(Boolean))];
  const sends=[];
  if(uniqueTokens.length)sends.push(getMessaging().sendEachForMulticast({tokens:uniqueTokens.slice(0,500),data:{title,body,tag,url},webpush:{fcmOptions:{link:url},headers:{Urgency:'high'}}}));
  webpush.setVapidDetails('mailto:james.matthew.hunt@me.com',webPushPublicKey,webPushPrivateKey.value());
  for(const subscription of subscriptions||[])sends.push(webpush.sendNotification(subscription,JSON.stringify({title,body,tag,url}),{TTL:3600,urgency:'high'}).catch(error=>{if(error.statusCode===404||error.statusCode===410)return;throw error;}));
  await Promise.all(sends);
  console.log(`Push channels attempted: ${sends.length}`);
}

exports.notifyTaskChanges = onDocumentUpdated(
  { document: 'systems/shared', region: 'europe-west2', secrets: [webPushPrivateKey] },
  async event => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const beforeTasks = taskMap(before.tasks);
    const afterTasks = taskMap(after.tasks);
    const notifications = [];
    const beforePunishments = taskMap(before.punishments);
    const beforeDisclosures = taskMap(before.disclosures);
    const beforeCheckIns = taskMap(before.checkIns);
    const beforeBadges = new Set((before.badges || []).map(badge => badge.id));
    const beforeJournal = taskMap(before.journal);
    const beforeStarLog = new Set((before.starLog || []).map(entry => String(entry.id)));

    if (after.pushTest?.nonce && after.pushTest.nonce !== before.pushTest?.nonce) {
      const role = after.pushTest.role === 'sub' ? 'sub' : 'dom';
      notifications.push(sendPush(after.pushTokens?.[role], after.pushSubscriptions?.[role], 'The System Push Test', 'Closed-app notifications are working on this device.', `manual-test-${after.pushTest.nonce}`, 'https://jxmeso.github.io/the-system-app/'));
    }

    for (const role of ['dom', 'sub']) {
      const oldEndpoints = new Set((before.pushSubscriptions?.[role] || []).map(subscription => subscription.endpoint));
      const newSubscriptions = (after.pushSubscriptions?.[role] || []).filter(subscription => !oldEndpoints.has(subscription.endpoint));
      if (newSubscriptions.length) {
        notifications.push(sendPush([], newSubscriptions, 'Background alerts enabled', 'This device will now receive notifications while The System is closed.', `push-ready-${role}`, 'https://jxmeso.github.io/the-system-app/'));
      }
    }

    for (const [id, task] of afterTasks) {
      const previous = beforeTasks.get(id);
      if (!previous && task.status === 'pending') {
        notifications.push(sendPush(
          after.pushTokens?.sub,
          after.pushSubscriptions?.sub,
          'New task assigned',
          task.title || 'A new task is waiting for you.',
          `new-task-${id}`,
          'https://jxmeso.github.io/the-system-app/?tab=tasks'
        ));
      } else if (previous?.status === 'pending' && task.status === 'completed') {
        notifications.push(sendPush(
          after.pushTokens?.dom,
          after.pushSubscriptions?.dom,
          'Task completed by Jacob',
          task.title || 'Jacob completed a task.',
          `completed-task-${id}`,
          'https://jxmeso.github.io/the-system-app/?tab=evidence'
        ));
      }
    }

    for (const punishment of after.punishments || []) {
      const previous = beforePunishments.get(String(punishment.id));
      if (!previous && punishment.status === 'active') {
        notifications.push(sendPush(after.pushTokens?.sub, after.pushSubscriptions?.sub, 'New punishment assigned', punishment.title || 'A punishment is now active.', `punishment-${punishment.id}`, 'https://jxmeso.github.io/the-system-app/?tab=punishments'));
      } else if (previous?.status === 'active' && punishment.status === 'completed') {
        notifications.push(sendPush(after.pushTokens?.dom, after.pushSubscriptions?.dom, 'Punishment completed', punishment.title || 'A punishment has ended.', `punishment-complete-${punishment.id}`, 'https://jxmeso.github.io/the-system-app/?tab=punishments'));
      }
    }

    for (const entry of after.journal || []) {
      if (!beforeJournal.has(String(entry.id))) notifications.push(sendPush(after.pushTokens?.dom, after.pushSubscriptions?.dom, 'New journal entry', entry.title || 'Jacob added a journal entry.', `journal-${entry.id}`, 'https://jxmeso.github.io/the-system-app/?tab=journal'));
    }

    for (const award of after.starLog || []) {
      if (!beforeStarLog.has(String(award.id)) && !String(award.reason || '').startsWith('Completed:')) notifications.push(sendPush(after.pushTokens?.sub, after.pushSubscriptions?.sub, 'Stars awarded', `${award.amount || 1} star${award.amount === 1 ? '' : 's'}: ${award.reason || 'Award from Sir'}`, `stars-${award.id}`, 'https://jxmeso.github.io/the-system-app/?tab=stars'));
    }

    for (const disclosure of after.disclosures || []) {
      const previous = beforeDisclosures.get(String(disclosure.id));
      if (!previous) {
        notifications.push(sendPush(after.pushTokens?.dom, after.pushSubscriptions?.dom, 'New private disclosure', disclosure.title || 'Jacob sent a private disclosure.', `disclosure-${disclosure.id}`, 'https://jxmeso.github.io/the-system-app/?tab=dashboard'));
      } else if (!previous.reply && disclosure.reply) {
        notifications.push(sendPush(after.pushTokens?.sub, after.pushSubscriptions?.sub, 'Sir replied privately', disclosure.title || 'A reply is waiting in your inbox.', `disclosure-reply-${disclosure.id}`, 'https://jxmeso.github.io/the-system-app/?tab=dashboard'));
      }
    }

    for (const checkIn of after.checkIns || []) {
      const previous = beforeCheckIns.get(String(checkIn.id));
      if (!previous && checkIn.status === 'pending') {
        notifications.push(sendPush(after.pushTokens?.sub, after.pushSubscriptions?.sub, 'Check-in requested', 'You have 10 minutes to complete your relationship check-in.', `checkin-${checkIn.id}`, 'https://jxmeso.github.io/the-system-app/?tab=dashboard'));
      } else if (previous?.status === 'pending' && checkIn.status === 'completed') {
        notifications.push(sendPush(after.pushTokens?.dom, after.pushSubscriptions?.dom, 'Check-in completed', 'Jacob submitted relationship feedback.', `checkin-complete-${checkIn.id}`, 'https://jxmeso.github.io/the-system-app/?tab=dashboard'));
      }
    }

    for (const badge of after.badges || []) {
      if (!beforeBadges.has(badge.id)) {
        notifications.push(sendPush(after.pushTokens?.sub, after.pushSubscriptions?.sub, 'Badge awarded', 'Sir authorised a new badge for you.', `badge-${badge.id}`, 'https://jxmeso.github.io/the-system-app/?tab=stars'));
      }
    }

    await Promise.all(notifications);
  }
);
