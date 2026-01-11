"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Method and Standards */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
            <span>Cálculo Estrutural</span>
            <span className="text-slate-300">•</span>
            <Link
              href="https://www.abntcatalogo.com.br/pnm.aspx?Q=TWhBVjNjL1FVQlNqQjRaVTMwMFJUYng1ZHQ5UEZxMnpaQk0wOW00RWFnND0="
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              NBR 6118:2023
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="https://www.abntcatalogo.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              NBR 6120:2019
            </Link>
          </div>

          {/* API Endpoint */}
          <div className="text-sm text-slate-500">
            API Endpoint:{" "}
            <code className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">
              POST /api/v1/*
            </code>
          </div>

          {/* Links Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="https://github.com/fcfim/NBR-6118-API"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Repositório
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="https://github.com/fcfim/NBR-6118-API#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Documentação
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="https://linkedin.com/in/fcfim"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-blue-600"
            >
              Criado por{" "}
              <span className="text-blue-600 hover:underline">@fcfim</span>
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-xs text-slate-400 mt-2">
            © {new Date().getFullYear()} NBR 6118 API • Ferramenta de apoio ao
            projeto estrutural
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
