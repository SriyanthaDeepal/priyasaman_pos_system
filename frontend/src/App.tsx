//import { Typography } from "@mui/material";
import DashboardPage from "./modules/dashboard";
import MainLayout from "./layouts/MainLayout/MainLayout";


function App() {
  return (
    <MainLayout>
      {(navigate: (path: string) => void) => <DashboardPage onNavigate={navigate} />}
    </MainLayout>
  );
}

export default App;