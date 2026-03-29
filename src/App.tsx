import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { RoomPage } from "./room/RoomPage";
import { MatchPage } from "./macth/MatchPage";
import { MatchGamePage } from "./match-game/MatchGamePage";

function App() {
  
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/customize"
          element={
            <Layout>
              <MatchPage />
            </Layout>
          }
        />
        <Route
          path="/"
          element={
            <Layout>
              <RoomPage />
            </Layout>
          }
        />
        <Route
          path="/matches"
          element={
            <Layout>
              <MatchPage />
            </Layout>
          }
        />
        <Route
          path="/matches/:id"
          element={
            <Layout>
              <MatchGamePage />
            </Layout>
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
