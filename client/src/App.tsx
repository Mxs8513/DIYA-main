// App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { SignUpPage } from "./SignUpPage";
import { StudentGroupsPage } from "./StudentGroupsPage";
import { StudentPopUp } from "./StudentPopUp";
import { StudentForumPage } from "./StudentForumPage";
import { StudentForumThreadPage } from "./StudentForumThreadPage";
import { StudentOfficeHours } from "./StudentOfficeHours";
import { StudentSelfCheckPage } from "./StudentSelfCheckPage";
import { TopicAnalysisPage } from "./TopicAnalysisPage";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/groups" element={<StudentGroupsPage />} />
      <Route path="/groups/:groupId/forum" element={<StudentForumPage />} />
      <Route path="/groups/:groupId/forum/:questionId" element={<StudentForumThreadPage />} />
      <Route path="/office-hours" element={<StudentOfficeHours/>}/>
      <Route path="/self-check" element={<StudentSelfCheckPage/>}/>
      <Route path="/analysis/topic/:topicId" element={<TopicAnalysisPage />}/>
      <Route path="/invite" element={
        <StudentPopUp
          adminName="Prof. A"
          groupName="CS 1337 — Computer Science I"
          onAccept={() => alert("Accepted!")}
          onDecline={() => alert("Declined!")}
        />
      } />
    </Routes>
  );
}