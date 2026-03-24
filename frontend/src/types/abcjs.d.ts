declare module "abcjs" {
  function renderAbc(
    target: HTMLElement,
    abc: string,
    options?: Record<string, unknown>
  ): void;
  export default { renderAbc };
}
