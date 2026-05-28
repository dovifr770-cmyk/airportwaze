// Web stub — expo-updates is not needed in browser
module.exports = {
  isEnabled: false,
  isEmergencyLaunch: false,
  updateId: null,
  manifest: null,
  channel: '',
  runtimeVersion: '',
  checkAutomatically: 'NEVER',
  checkForUpdateAsync: () => Promise.resolve({ isAvailable: false }),
  fetchUpdateAsync: () => Promise.resolve({ isNew: false }),
  reloadAsync: () => Promise.resolve(),
  getExtraParamsAsync: () => Promise.resolve({}),
  setExtraParamAsync: () => Promise.resolve(),
  useUpdates: () => ({ isUpdateAvailable: false, isUpdatePending: false }),
};
