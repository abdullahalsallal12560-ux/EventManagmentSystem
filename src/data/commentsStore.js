import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocsWhere, generateId } from "../firebase/firestoreHelpers";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const COMMENT_TYPE = {
  QUESTION: "question",
  COMMENT: "comment",
};

const CONTENT_MAX_LENGTH = 500;

// Fields: id (PK), eventId (FK), authorId (FK), authorName, content
// (string, max 500 chars), createdAt, type ("question" | "comment"), plus
// answeredBy (FK -> USERS) / answer / answeredAt once a question gets a
// reply from the event's club admin.
export async function getCommentsByEvent(eventId) {
  const comments = await getDocsWhere(COLLECTIONS.EVENT_COMMENTS, "eventId", "==", eventId);
  return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addComment(eventId, authorId, authorName, content, type) {
  const id = generateId("cmt");
  await createDoc(COLLECTIONS.EVENT_COMMENTS, id, {
    eventId,
    authorId,
    authorName,
    content: content.slice(0, CONTENT_MAX_LENGTH),
    createdAt: new Date().toISOString(),
    type,
    answeredBy: null,
    answer: null,
    answeredAt: null,
  });
}

export async function addAnswer(commentId, answeredBy, answer) {
  await updateDoc(doc(db, COLLECTIONS.EVENT_COMMENTS, commentId), {
    answeredBy,
    answer,
    answeredAt: new Date().toISOString(),
  });
}
