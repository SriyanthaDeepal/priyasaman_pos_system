//import { Typography } from "@mui/material";
import DashboardPage from "./modules/dashboard";
import MainLayout from "./layouts/MainLayout/MainLayout";


function App() {
  return (
    <MainLayout>
      {(navigate: (path: string) => void, language: "EN" | "SI") => <DashboardPage onNavigate={navigate} language={language} />}
    </MainLayout>
  );
}

export default App;