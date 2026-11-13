import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../lib/api";
import Home from "./Home";
import Navbar from "./Navbar";

jest.mock("../lib/api", () => ({
  apiRequest: jest.fn(),
  USER_TOKEN_KEY: "userToken",
}));

beforeEach(() => {
  localStorage.clear();
  apiRequest.mockResolvedValue([]);
});

test("filters products by brand and paginates the matching results", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Home />
    </MemoryRouter>
  );
  await act(async () => { await Promise.resolve(); });

  await screen.findByText("60 sản phẩm");
  fireEvent.click(screen.getByRole("button", { name: "iPhone" }));

  expect(screen.getByText("20 sản phẩm")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "iPhone 11 64GB" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tiếp" }));

  expect(screen.getByText("Trang 2 / 2")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "iPhone 11 64GB" })).not.toBeInTheDocument();
});

test("searches the catalog from the navigation bar", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
      <Home />
    </MemoryRouter>
  );
  await act(async () => { await Promise.resolve(); });

  fireEvent.change(screen.getByRole("searchbox", { name: "Tìm kiếm sản phẩm" }), {
    target: { value: "iPhone 11 64GB" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));

  expect(await screen.findByText("1 sản phẩm")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "iPhone 11 64GB" })).toBeInTheDocument();
});
