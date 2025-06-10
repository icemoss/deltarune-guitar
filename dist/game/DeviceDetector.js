export class DeviceDetector {
    static isMobile() {
        const hasTouchScreen = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth <= 768;
        return hasTouchScreen && (isMobileUserAgent || isSmallScreen);
    }
}
//# sourceMappingURL=DeviceDetector.js.map