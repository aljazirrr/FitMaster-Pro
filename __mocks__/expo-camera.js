const React = require('react');

// Mock CameraView
const CameraView = React.forwardRef(function CameraView(props, ref) {
  return null;
});
CameraView.displayName = 'CameraView';

// Mock useCameraPermissions
let _permissionGranted = true;

function useCameraPermissions() {
  const [permission, setPermission] = React.useState(
    _permissionGranted ? { granted: true, canAskAgain: true, status: 'granted' } : null,
  );

  const requestPermission = async () => {
    const granted = { granted: true, canAskAgain: false, status: 'granted' };
    setPermission(granted);
    return granted;
  };

  return [permission, requestPermission];
}

// Test helpers
function _setPermissionGranted(granted) {
  _permissionGranted = granted;
}

module.exports = {
  CameraView,
  useCameraPermissions,
  _setPermissionGranted,
};
