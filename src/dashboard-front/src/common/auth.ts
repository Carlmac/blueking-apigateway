// 定义登录数据接口
export interface ILoginData {
  target?: string
  width?: number
  height?: number
  login_url?: string
  login_plain_url?: string
}

// 定义是否显示登录弹框的标志
let isShow = false;
// 定义登录窗口对象
let loginWindow: Window = null;
// 定义轮询检查窗口关闭的定时器
let checkWindowTimer = -1;

// 获取登录地址
const getLoginUrl = (url: string, cUrl: string, size: string) => {
  const loginUrl = new URL(url);
  loginUrl.searchParams.append('size', size);
  loginUrl.searchParams.append('is_from_logout', '1');
  loginUrl.searchParams.append('c_url', cUrl);
  return loginUrl.href;
};

// 监听已登录关闭弹框
const messageListener = ({ data = {} }: MessageEvent) => {
  if (data === null || typeof data !== 'object' || data.target !== 'bk-login' || !loginWindow) return;

  hideLoginModal();
};

// 添加消息监听器
window.addEventListener('message', messageListener, false);

// 在页面卸载前移除消息监听器
window.addEventListener('beforeunload', () => {
  window.removeEventListener('message', messageListener, false);
});

// 轮询判断是否已关闭弹框
const checkWinClose = () => {
  checkWindowTimer && clearTimeout(checkWindowTimer);
  checkWindowTimer = window.setTimeout(() => {
    if (!loginWindow || loginWindow.closed) {
      hideLoginModal();
      clearTimeout(checkWindowTimer);
      return;
    }
    checkWinClose();
  }, 300);
};

// 关闭弹框
export const hideLoginModal = () => {
  isShow = false;
  if (loginWindow) {
    loginWindow.close();
  }
  loginWindow = null;
};

// 展示弹框
export const showLoginModal = (data: ILoginData = {}) => {
  if (isShow) return;
  isShow = true;
  const url = data?.login_url || getLoginUrl(`${window.BK_LOGIN_URL}/plain`, `${location.origin}/static/login_success.html?is_ajax=1`, 'big');
  const width = 700;
  const height = 510;
  const { availHeight, availWidth } = window.screen;
  loginWindow = window.open(
    url,
    '_blank',
    `
      width=${width},
      height=${height},
      left=${(availWidth - width) / 2},
      top=${(availHeight - height) / 2},
      channelmode=0,
      directories=0,
      fullscreen=0,
      location=0,
      menubar=0,
      resizable=0,
      scrollbars=0,
      status=0,
      titlebar=0,
      toolbar=0,
      close=0
    `,
  );
  checkWinClose();
};

// 退出登录
export const logout = () => {
  location.href = getLoginUrl(window.BK_LOGIN_URL, location.origin, 'small');
};
