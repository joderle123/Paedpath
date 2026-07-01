import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import MapHome from "./pages/MapHome";
import ClassDetail from "./pages/ClassDetail";
import Absences from "./pages/Absences";
import Classes from "./pages/Classes";
import People from "./pages/People";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<MapHome />} />
          <Route path="class/:id" element={<ClassDetail />} />
          <Route path="absences" element={<Absences />} />
          <Route path="classes" element={<Classes />} />
          <Route path="people" element={<People />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
