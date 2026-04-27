"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LockKeyhole } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const initialErrorMessage = useMemo(() => {
    if (!errorParam) {
      return null;
    }

    return "El enlace de restablecimiento no es válido o ha expirado.";
  }, [errorParam]);

  const isTokenMissing = !token || typeof token !== "string";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (isTokenMissing) {
      setErrorMessage("Falta el token de restablecimiento.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setErrorMessage(
          error.message ??
            "No se pudo restablecer la contraseña. Intenta nuevamente.",
        );
        return;
      }

      setSuccessMessage("Contraseña cambiada correctamente.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.replace("/");
      }, 1500);
    } catch {
      setErrorMessage(
        "No se pudo restablecer la contraseña. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole className="size-6" />
          </div>
          <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
          <CardDescription>
            Ingresa una nueva contraseña para tu cuenta de Agroalva.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {(initialErrorMessage || errorMessage) && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage ?? initialErrorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                {successMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu nueva contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting || isTokenMissing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirma tu nueva contraseña"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting || isTokenMissing}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isTokenMissing}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar nueva contraseña"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Link
                href="/"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
