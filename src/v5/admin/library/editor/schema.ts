import { Node } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { EMPTY_QUIZ, EMPTY_TASK } from "./blocks";

/**
 * The block editor's schema without its React views, so the tests can check that `blocks.ts`
 * produces documents Tiptap accepts (`nodes.tsx` adds the editing forms on top).
 */

export const VideoBlockBase = Node.create({
  name: "videoBlock",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes: () => ({ videoId: { default: "" }, title: { default: "" }, input: { default: null } }),
  parseHTML: () => [{ tag: "div[data-block=video]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", { "data-block": "video", ...HTMLAttributes }],
});

export const QuizBlockBase = Node.create({
  name: "quizBlock",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes: () => ({ question: { default: EMPTY_QUIZ.question }, options: { default: EMPTY_QUIZ.options }, correct: { default: EMPTY_QUIZ.correct }, why: { default: EMPTY_QUIZ.why } }),
  parseHTML: () => [{ tag: "div[data-block=quiz]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", { "data-block": "quiz", ...HTMLAttributes }],
});

export const TaskBlockBase = Node.create({
  name: "taskBlock",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes: () => ({ instructions: { default: EMPTY_TASK.instructions }, doneWhen: { default: EMPTY_TASK.doneWhen } }),
  parseHTML: () => [{ tag: "div[data-block=task]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", { "data-block": "task", ...HTMLAttributes }],
});

/** Only what the lesson text can hold: no headings, quotes, rules, strike, underline or links. */
export const lessonStarterKit = StarterKit.configure({ heading: false, blockquote: false, horizontalRule: false, strike: false, underline: false, link: false });
