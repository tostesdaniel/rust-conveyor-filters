import { SignIn } from "@clerk/nextjs";

export default function AuthPage() {
  return <SignIn oidcPrompt='select_account' />;
}
