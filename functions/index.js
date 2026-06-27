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

    try {
      await Promise.all(notifications);
      await eventRef.set({ processedAt: new Date().toISOString(), notifications: notifications.length }, { merge: true });
    } catch (error) {
      await eventRef.delete();
      throw error;
    }
  }
);
