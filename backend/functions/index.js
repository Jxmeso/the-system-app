// Cloud Functions - push-to-James. Deploy needs the Blaze plan (see DEPLOY.md).
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
admin.initializeApp();
exports.notifyJames = onDocumentCreated('systems/shared/outbound/{id}', async (event) => {
  const data = event.data && event.data.data();
  if (!data) return;
  const meta = await admin.firestore().doc('systems/shared/meta/auth').get();
  const token = meta.exists ? meta.get('jamesToken') : null;
  if (!token) return;
  try {
    await admin.messaging().send({
      token,
      notification: { title: data.title || 'The System', body: data.body || '' },
      data: { url: data.url || '/the-system-app/', tag: data.tag || 'system' },
    });
  } catch (e) {
    console.error('FCM send failed', e);
  } finally {
    await event.data.ref.delete().catch(() => {});
  }
});
