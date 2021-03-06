import * as ls from '../../utils/localStorage';

const user = ls.get('setting.theme') ? ls.get('setting.theme') : false;
const prefersDark = getSystemPreference();

const initial = {
  system: prefersDark ? 'dark' : 'light',
  user,
  active: !user ? prefersDark ? 'dark' : 'light' : user
};

function getSystemPreference() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function updateScrollbars(theme) {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.style.setProperty('--scrollbar-track', '#202020');
    root.style.setProperty('--scrollbar-draggy', '#414141');
  } else {
    root.style.setProperty('--scrollbar-track', '#a7a7a7');
    root.style.setProperty('--scrollbar-draggy', '#cacaca');
  }
}

export default function reducer(state = initial, action) {
  const prefersDark = getSystemPreference();

  switch (action.type) {
    case 'SET_THEME':
      const user = action.payload === 'system' ? false : action.payload;
      const active = !user ? prefersDark ? 'dark' : 'light' : user;

      ls.set('setting.theme', user);

      updateScrollbars(active);

      return {
        system: prefersDark ? 'dark' : 'light',
        user,
        active
      };
    default:

      updateScrollbars(state.active);
      
      return state;
  }
}
