import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Callback } from "./pages/auth/Callback";
import { Login } from "./pages/auth/Login";
import { Layout } from "./layout/Layout";
import { Match } from "./pages/match/Match";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/auth/callback" element={<Callback />} />

        {/* Protected routes */}
        <Route
          path="/customize"
          element={
            <ProtectedRoute>
              <Layout><Match /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/match/:id?"
          element={
            <ProtectedRoute>
              <Layout><Match /></Layout>
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/games"
          element={
            <ProtectedRoute>
              <Layout><GamesPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/draft"
          element={
            <ProtectedRoute>
              <Layout><DraftPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/draft-gap"
          element={
            <DraftGap />
          }
        /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;


