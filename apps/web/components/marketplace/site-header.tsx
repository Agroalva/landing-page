"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { Bell, Heart, LogOut, Menu, MessageCircle, Plus, UserRound } from "lucide-react";
import { api } from "@/lib/convex-api";
import { authClient } from "@/lib/auth-client";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";

const publicLinks = [
    { href: "/?type=sell#catalogo", label: "Productos", section: "products" },
    { href: "/?type=rent#catalogo", label: "Servicios", section: "services" },
    { href: "/?type=rent&family=personal&category=personal_services#catalogo", label: "Personal", section: "personnel" },
    { href: "/help", label: "Ayuda", section: "help" },
];

export function SiteHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading } = useAuthSession();
    const profile = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");
    const unreadNotifications = useQuery(
        api.notifications.getUnreadCount,
        isAuthenticated ? {} : "skip",
    );

    if (pathname.startsWith("/admin")) {
        return null;
    }

    const signOut = async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-[#fbfaf5]/95 backdrop-blur-xl">
            <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex shrink-0 items-center" aria-label="Agroalva, inicio">
                    <Image src="/logo.svg" alt="Agroalva" width={150} height={44} className="h-9 w-auto" priority />
                </Link>

                <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
                    {publicLinks.map((link) => {
                        const type = searchParams.get("type");
                        const family = searchParams.get("family");
                        const isActive = link.section === "help"
                            ? pathname === "/help"
                            : pathname === "/" && (
                                link.section === "personnel"
                                    ? family === "personal"
                                    : link.section === "products"
                                        ? type === "sell" && family !== "personal"
                                        : type === "rent" && family !== "personal"
                            );
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    isActive
                                        ? "bg-emerald-950 text-white"
                                        : "text-stone-700 hover:bg-emerald-950/5 hover:text-emerald-950"
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    {isLoading ? (
                        <div className="h-10 w-24 animate-pulse rounded-full bg-stone-200" />
                    ) : isAuthenticated ? (
                        <>
                            <Button asChild className="hidden rounded-full bg-[#1f5b3b] sm:inline-flex">
                                <Link href="/publish"><Plus className="size-4" /> Publicar</Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex">
                                <Link href="/favorites" aria-label="Favoritos"><Heart className="size-5" /></Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex">
                                <Link href="/messages" aria-label="Mensajes"><MessageCircle className="size-5" /></Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="relative hidden rounded-full sm:inline-flex">
                                <Link href="/notifications" aria-label="Notificaciones">
                                    <Bell className="size-5" />
                                    {Boolean(unreadNotifications) && (
                                        <span className="absolute right-1 top-1 size-2 rounded-full bg-amber-500" />
                                    )}
                                </Link>
                            </Button>
                            <details className="group relative">
                                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-emerald-950/10 bg-white px-3 py-2 text-sm font-semibold text-emerald-950 shadow-sm">
                                    <UserRound className="size-4" />
                                    <span className="hidden max-w-28 truncate lg:inline">{profile?.displayName || "Mi cuenta"}</span>
                                    <Menu className="size-4 lg:hidden" />
                                </summary>
                                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border bg-white p-2 shadow-xl">
                                    <Link href="/publish" className="mobile-menu-link sm:hidden"><Plus className="size-4" /> Publicar</Link>
                                    <Link href="/favorites" className="mobile-menu-link sm:hidden"><Heart className="size-4" /> Favoritos</Link>
                                    <Link href="/messages" className="mobile-menu-link sm:hidden"><MessageCircle className="size-4" /> Mensajes</Link>
                                    <Link href="/notifications" className="mobile-menu-link sm:hidden"><Bell className="size-4" /> Notificaciones</Link>
                                    <Link href="/my-listings" className="mobile-menu-link">Mis publicaciones</Link>
                                    <Link href="/account/profile" className="mobile-menu-link">Editar perfil</Link>
                                    <button onClick={signOut} className="mobile-menu-link w-full text-left text-red-700">
                                        <LogOut className="size-4" /> Cerrar sesión
                                    </button>
                                </div>
                            </details>
                        </>
                    ) : (
                        <>
                            <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
                                <Link href="/sign-in">Ingresar</Link>
                            </Button>
                            <Button asChild className="rounded-full bg-[#1f5b3b]">
                                <Link href="/sign-up">Crear cuenta</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
