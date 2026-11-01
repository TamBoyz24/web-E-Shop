import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "./AdminRoute";

const renderAdminRoute = (role) => {
  localStorage.setItem("adminToken", "test-token");
  if (role) {
    localStorage.setItem("adminSession", JSON.stringify({ role }));
  } else {
    localStorage.removeItem("adminSession");
  }

  return render(
    <MemoryRouter initialEntries={["/admin/staff"]}>
      <Routes>
        <Route
          path="/admin/staff"
          element={<AdminRoute ownerOnly><div>staff management</div></AdminRoute>}
        />
        <Route path="/admin" element={<div>admin dashboard</div>} />
        <Route path="/admin/login" element={<div>admin login</div>} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  localStorage.clear();
});

test("redirects staff away from owner-only staff management", () => {
  renderAdminRoute("staff");

  expect(screen.getByText("admin dashboard")).toBeInTheDocument();
  expect(screen.queryByText("staff management")).not.toBeInTheDocument();
});

test("allows the owner to open staff management", () => {
  renderAdminRoute("owner");

  expect(screen.getByText("staff management")).toBeInTheDocument();
});

test("redirects a missing session to admin login", () => {
  renderAdminRoute(null);

  expect(screen.getByText("admin login")).toBeInTheDocument();
});

test("redirects a malformed session to admin login", () => {
  localStorage.setItem("adminToken", "test-token");
  localStorage.setItem("adminSession", "{");

  render(
    <MemoryRouter initialEntries={["/admin/staff"]}>
      <Routes>
        <Route path="/admin/staff" element={<AdminRoute ownerOnly><div>staff management</div></AdminRoute>} />
        <Route path="/admin/login" element={<div>admin login</div>} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText("admin login")).toBeInTheDocument();
});
