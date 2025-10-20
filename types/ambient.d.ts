declare module "@prisma/client" {
  export type PrismaClient = any;
}

declare module "open-graph-scraper" {
  const ogs: any;
  export default ogs;
}

declare module "@tanstack/react-query" {
  export const QueryClient: any;
  export const QueryClientProvider: any;
}

declare module "react-hook-form" {
  export const useForm: any;
}

declare module "zod" {
  export const z: any;
}
