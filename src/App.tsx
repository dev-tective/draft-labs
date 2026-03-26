import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { Match } from "./pages/match/Match";
import { GamesPage } from "./pages/game/GamesPage";
import { useUserStore } from "./stores/userStore";
import { useEffect, useRef } from "react";
import { UserModal } from "./components/modals/UserModal";
import { ModalRef } from "./layout/ModalLayout";

function App() {
  const { user } = useUserStore();
  const userModalRef = useRef<ModalRef>(null);

  // Abre el modal automáticamente si no hay usuario
  useEffect(() => {
    if (!user) {
      userModalRef.current?.open();
    }
  }, [user]);

  return (
    <BrowserRouter>
      <UserModal ref={userModalRef} />
      <Routes>
        <Route
          path="/customize"
          element={
            <Layout>
              <Match />
            </Layout>
          }
        />
        <Route
          path="/:roomId?"
          element={
            <Layout>
              <Match />
            </Layout>
          }
        />
        <Route
          path="/games"
          element={
            <Layout>
              <GamesPage />
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
