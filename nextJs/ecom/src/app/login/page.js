"use client";

import Link from "next/link";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

const Page = () => {
  let { hydrateUser } = useAuth();
  let router = useRouter();

  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  let handleChange = (e) => {
    let { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  let handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const enteredName = formData.username?.trim();
      const username =
        enteredName?.toLowerCase() === "emily.johnson@x.dummyjson.com"
          ? "emilys"
          : enteredName;

      const response = await api.post("/auth/login", {
        username,
        password: formData.password,
        expiresInMins: 60,
      });
      const token = response.data.accessToken;

      if (!token) throw new Error("The auth service did not return a token.");

      window.localStorage.setItem("accessToken", token);
      const user = await hydrateUser();

      if (!user) {
        throw new Error("Login succeeded, but your session could not be loaded.");
      }

      router.replace("/layout/home");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || "Login failed. Please try again.",
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md rounded-2xl border shadow-xl">
        <CardContent className="p-8">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Demo login: <strong>emilys</strong> (or
              <strong> emily.johnson@x.dummyjson.com</strong>) /{" "}
              <strong>emilyspass</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <p role="alert" className="text-sm text-red-600">
                {errorMessage}
              </p>
            )}
            {/* Email */}
            <div className="space-y-2">
              <Label>Username or email</Label>

              <Input
                name="username"
                onChange={handleChange}
                type="text"
                autoComplete="username"
                placeholder="Enter username or demo email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label>Password</Label>

              <Input
                name={"password"}
                onChange={handleChange}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            {/* Button */}
            <Button className="w-full rounded-xl">Login</Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
