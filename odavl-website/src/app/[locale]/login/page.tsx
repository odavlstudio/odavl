
"use client";
/*
 * ODAVL Login Page - Professional Authentication
 * Glass morphism design with comprehensive form validation
 */



// NOTE: This page is intentionally dynamic (not statically exported) because Next.js 15+ does not allow client components or interactivity with generateStaticParams.
// This preserves login form interactivity and i18n. All other routes are statically exported.

import LoginForm from './LoginForm';

// Server component wrapper for static export
export default function LoginPage() {
  return <LoginForm />;
}
