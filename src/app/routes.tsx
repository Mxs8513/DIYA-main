import { createBrowserRouter, Navigate } from "react-router";
import { GroupPage } from "../imports/pasted_text/group-page";
import { ForumPage } from "./components/ForumPage";
import { QuestionDetailPage } from "./components/QuestionDetailPage";
import { EditGroupPage } from "./components/EditGroupPage";
import { RequestsPage } from "./components/RequestsPage";
import { AnalysisPage } from "./components/AnalysisPage";
import { TopicDetailPage } from "./components/TopicDetailPage";
import { CalendarPage } from "./components/CalendarPage";
import { WorkflowQueuePage } from "./components/WorkflowQueuePage";
import { InterventionPage } from "./components/InterventionPage";
import { AdminPage } from "./components/AdminPage";
import KnowledgeBasePage from "./components/KnowledgeBasePage";
import { ApprovedAnswersPage } from "./components/ApprovedAnswersPage";

// Student pages
import { LandingPage } from "./components/student/LandingPage";
import { LoginPage } from "./components/student/LoginPage";
import { SignUpPage } from "./components/student/SignUpPage";
import { StudentProfilePage } from "./components/student/StudentProfilePage";
import { StudentGroupsPage } from "./components/student/StudentGroupsPage";
import { StudentForumPage } from "./components/student/StudentForumPage";
import { StudentForumThreadPage } from "./components/student/StudentForumThreadPage";
import { StudentOfficeHours } from "./components/student/StudentOfficeHours";
import { StudentSelfCheckPage } from "./components/student/StudentSelfCheckPage";
import { StudentPopUp } from "./components/student/StudentPopUp";
import { TopicAnalysisPage } from "./components/student/TopicAnalysisPage";

export const router = createBrowserRouter([
  // Landing / auth
  { path: "/",        element: <LandingPage /> },
  { path: "/login",   element: <LoginPage /> },
  { path: "/signup",  element: <SignUpPage /> },

  // Student
  { path: "/profile",                              element: <StudentProfilePage /> },
  { path: "/groups",                               element: <StudentGroupsPage /> },
  { path: "/groups/:groupId/forum",                element: <StudentForumPage /> },
  { path: "/groups/:groupId/forum/:questionId",    element: <StudentForumThreadPage /> },
  { path: "/office-hours",                         element: <StudentOfficeHours /> },
  { path: "/self-check",                           element: <StudentSelfCheckPage /> },
  { path: "/analysis/topic/:topicId",              element: <TopicAnalysisPage /> },
  { path: "/invite",  element: <StudentPopUp adminName="Prof. A" groupName="CS 1337" onAccept={() => {}} onDecline={() => {}} /> },

  // Professor — existing
  { path: "/professor",                            Component: GroupPage },
  { path: "/forum/:groupName",                     Component: ForumPage },
  { path: "/forum/:groupName/question/:questionId", Component: QuestionDetailPage },
  { path: "/edit-group/:groupName",                Component: EditGroupPage },
  { path: "/requests/:groupName",                  Component: RequestsPage },
  { path: "/analysis/:groupName",                  Component: AnalysisPage },
  { path: "/analysis/:groupName/topic/:topicId",   Component: TopicDetailPage },
  { path: "/calendar/:groupName",                  Component: CalendarPage },

  // Professor — new workflow/intelligence pages
  { path: "/workflow/:groupName",                  Component: WorkflowQueuePage },
  { path: "/interventions/:groupName",             Component: InterventionPage },
  { path: "/admin/:groupName",                     element: <AdminPage /> },
  { path: "/knowledge/:groupName",                 element: <KnowledgeBasePage /> },
  { path: "/approved/:groupName",                  element: <ApprovedAnswersPage /> },

  // Catch-all
  { path: "*", element: <Navigate to="/" replace /> },
]);
