<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
    <AppHeader />
    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <slot />
    </main>
    <AppFooter />
    <ClientOnly>
      <LoginModal />
    </ClientOnly>
  </div>
</template>
