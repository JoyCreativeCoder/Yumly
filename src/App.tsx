import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./components/pages/Home/Home";
import Details from "./components/pages/Details/details";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/recipe/:id" element={<Details />} />
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}
