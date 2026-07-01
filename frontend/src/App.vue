<template>
  <div id="app-root">
    <router-view @logout="handleLogout" />
    <Chatbot />
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import Chatbot from './components/Chatbot.vue';
import { logoutSession } from './router';

export default {
  name: 'App',
  components: {
    Chatbot
  },
  setup() {
    const router = useRouter();

    const handleLogout = () => {
      logoutSession();
      router.push('/');
    };

    return {
      handleLogout
    };
  }
};
</script>

<style>
/* Base Styles */
#app-root {
  width: 100%;
  height: 100%;
}
</style>
