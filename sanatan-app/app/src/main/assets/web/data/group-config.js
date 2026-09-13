/* Bhakti Daily — Family / Group Jaap config.
 *
 * Group Jaap ke liye ek FREE Firebase (Firestore) project chahiye.
 * Jab tak niche `projectId` khali hai, app "setup pending" screen dikhayega —
 * baaki poora app normal chalega. Setup ke liye GROUP_SETUP.md padho.
 *
 * Bharo (GROUP_SETUP.md me step-by-step):
 *   projectId : Firebase console → Project settings → "Project ID"
 *   apiKey    : Project settings → "Web API Key"
 *
 * NOTE: ye "Web API Key" secret nahi hai (client apps me public hota hai) —
 * suraksha Firestore Security Rules se aati hai, key chhupane se nahi.
 */
window.BHAKTI_GROUP_CONFIG = {
  projectId: "",   // <-- yahan apna Firebase Project ID daalo
  apiKey: ""       // <-- yahan apna Web API Key daalo
};
