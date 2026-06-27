const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

function taskMap(tasks = []) {
  return new Map(tasks.map(task => [String(task.id), task]));
}

async function sendPush(tokens, title, body, tag, url) {
  const uniqueTokens = [...new Set((tokens || []).filter(Boolean))];
  if (!uniqueTokens.length) return;
  const response = await getMessaging().sendEachForMulticast({
    tokens: uniqueTokens.slice(0, 500),
    data: { title, body, tag, url },
    webpush: {
      fcmOptions: { link: url },
      headers: { Urgency: 'high' }
    }
  });
  console.log(`Push result: ${response.successCount} sent, ${response.failureCount} failed`);
}

exports.notifyTaskChanges = onDocumentUpdated(
  { document: 'systems/shared', region: 'europe-west2' },
  async event => {
    const eventRef = getFirestore().collection('notificationEvents').doc(event.id);
    try {
      await eventRef.create({ processingStartedAt: new Date().toISOString() });
    } catch (error) {
      if (error.code === 6 || error.code === 'already-exists') return;
      throw error;
    }
    const before = event.data.before.data();
    const after = event.data.after.data();
    const beforeTasks = taskMap(before.tasks);
    const afterTasks = taskMap(after.tasks);
    const notifications = [];
    const beforePunishments = taskMap(before.punishments);
    const beforeDisclosures = taskMap(before.disclosures);
    const beforeCheckIns = taskMap(before.checkIns);
    const beforeBadges = new Set((before.badges || []).map(badge => badge.id));

    for (const [id, task] of afterTasks) {
      const previous = beforeTasks.get(id);
      if (!previous && task.status === 'pending') {
        notifications.push(sendPush(
          after.pushTokens?.sub,
          'New task assigned',
          task.title || 'A new task is waiting for you.',
          `new-task-${id}`,
          'https://jxmeso.github.io/the-system-app/?tab=tasks'
        ));
      } else if (previous?.status === 'pending' && task.status === 'completed') {
        notifications.push(sendPush(
          after.pushTokens?.dom,
          'Task completed by Jacob',
          task.title || 'Jacob completed a task.',
          `completed-task-${id}`,
          'https://jxmeso.github.io/the-system-app/?tab=evidence'
        ));
      }
    }

    for (const punishment of after.punishments || []) {
      if (!beforePunishments.has(String(punishment.id)) && punishment.status === 'active') {
        notifications.push(sendPush(after.pushTokens?.sub, 'New punishment assigned', punishment.title || 'A punishment is now active.', `punishment-${punishment.id}`, 'https://jxmeso.github.io/the-system-app/?tab=punishments'));
      }
    }

    for (const disclosure of after.disclosures || []) {
      const previous = beforeDisclosures.get(String(disclosure.id));
      if (!previous) {
        notifications.push(sendPush(after.pushTokens?.dom, 'New private disclosure', disclosure.title || 'Jacob sent a private disclosure.', `disclosure-${disclosure.id}`, 'https://jxmeso.github.io/the-system-app/?tab=dashboard'));
      } else if (!previous.reply && disclosure.reply) {
        notifications.push(sendPush(after.pushTokens?.sub, 'Sir replied privately', disclosure.title || 'A reply is waiting in your inbox.', `disclosure-reply-${disclosure.id}`, 'https://jxmeso.github.io/the-system-app/?tab=dashboard'));
      }
    }

    for (const checkIn of after.checkIns || []) {
      const previous = beforeCheckIns.get(String(checkIn.id));
      if (!previous && checkIn.status === 'pending') {
        notifications.push(sendPush(after.pushTokens?.sub, 'Check-in requested', 'You have 10 minutes to complete your relationship check-in.', `checkin-${checkIn.id}`, 'https://jxmeso.github.io/the-system-app/?tab=dashboard'));
      } else if (previous?.status === 'pending' && checkIn.status === 'completed') {
        notifications.push(sendPush(after.pushTokens?.dom, 'Check-in completed', 'Jacob submitted relationship feedback.', `checkin-complete-${checkIn.id}`, 'https://jxmeso.github.io/the-system-app/?tab=dashboard'));
      }
    }

    for (const badge of after.badges || []) {
      if (!beforeBadges.has(badge.id)) {
        notifications.push(sendPush(after.pushTokens?.sub, 'Badge awarded', 'Sir authorised a new badge for you.', `badge-${badge.id}`, 'https://jxmeso.github.io/the-system-app/?tab=stars'));
      }
    }

    try {
      await Promise.all(notifications);
      await eventRef.set({ processedAt: new Date().toISOString(), notifications: notifications.length }, { merge: true });
    } catch (error) {
      await eventRef.delete();
      throw error;
    }
  }
);
