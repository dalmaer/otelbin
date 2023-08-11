import Head from "next/head";
import MonacoEditor from "~/components/monaco-editor/MonacoEditor";
import { EditorProvider } from "~/contexts/EditorContext";

export default function Home() {
  return (
    <>
      <Head>
        <title>OpenTelemetry Collector Web</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen">
        <EditorProvider>
        <MonacoEditor />
        </EditorProvider>
      </main>
    </>
  );
}

