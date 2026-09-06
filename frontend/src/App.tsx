import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import SearchPage from "./components/SearchPage";
import ReaderPage from "./components/ReaderPage";
import BrowsePage from "./components/BrowsePage";
import AboutPage from "./components/AboutPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SearchPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/read" element={<ReaderPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
