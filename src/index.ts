async function bootstrap(): Promise<void> {
  console.log('octopus-signage-player starting...');
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
