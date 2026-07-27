"use client";

import { createTheme, CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#496800", contrastText: "#ffffff" },
    secondary: { main: "#586249" },
    background: { default: "#faf9f1", paper: "#f4f3eb" },
    text: { primary: "#1b1c18", secondary: "#5e6256" },
    divider: "#c5c8b9",
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: "var(--font-manrope), sans-serif",
    h1: { fontWeight: 800, fontSize: "clamp(3rem, 5.5vw, 4.75rem)", lineHeight: 0.98, letterSpacing: "-0.075em" },
    h2: { fontWeight: 800, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.055em" },
    h3: { fontWeight: 750, fontSize: "1rem", letterSpacing: "-0.025em" },
    body1: { fontSize: "0.9375rem", lineHeight: 1.7 },
    body2: { fontSize: "0.75rem", lineHeight: 1.55 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </div>
  );
}
