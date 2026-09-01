// Bottom tab navigator for the 3 screens: Logger, Progress, Calendar.
// Logger is the default home (path: /).

import { IoBarbell, IoCalendar, IoTrendingUp } from "react-icons/io5";
import { NavLink, Outlet } from "react-router-dom";

export default function TabLayout() {
  return (
    <>
      <Outlet />
      <nav className="tab-bar">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
          data-testid="tab-logger"
        >
          <IoBarbell />
          Logger
        </NavLink>
        <NavLink
          to="/progress"
          className={({ isActive }) => (isActive ? "active" : "")}
          data-testid="tab-progress"
        >
          <IoTrendingUp />
          Progress
        </NavLink>
        <NavLink
          to="/calendar"
          className={({ isActive }) => (isActive ? "active" : "")}
          data-testid="tab-calendar"
        >
          <IoCalendar />
          Calendar
        </NavLink>
      </nav>
    </>
  );
}
