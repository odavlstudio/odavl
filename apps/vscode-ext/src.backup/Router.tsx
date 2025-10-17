import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./views/Dashboard";
import Recipes from "./views/Recipes";
import Activity from "./views/Activity";
import Config from "./views/Config";
import Intelligence from "./views/Intelligence";
import Insights from "./views/Insights";

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="recipes" element={<Recipes />} />
                    <Route path="activity" element={<Activity />} />
                    <Route path="config" element={<Config />} />
                    <Route path="intelligence" element={<Intelligence />} />
                    <Route path="insights" element={<Insights />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
