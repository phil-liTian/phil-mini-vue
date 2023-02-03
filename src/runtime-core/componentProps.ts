export function initProps(instance, rawProps) {
  console.log('rawProps', rawProps);
  
  instance.props = rawProps || {}
}