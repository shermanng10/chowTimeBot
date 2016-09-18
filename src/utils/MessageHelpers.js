export function getSearchTerms(message) {
  const messageArray = message.text.replace('search', '').split(':')
  if (message.text.match(/^\S+/)[0] != 'search' || messageArray.length <= 1) {
    throw new Error("Please follow the format search format of \"search cuisine/criteria : location\"")
  } else {
    const searchCritera = messageArray[0]
    const location = messageArray[1]
    return {
      term: searchCritera,
      location: location
    }
  }
}

export function buildAttachment(options) {
  return JSON.parse(JSON.stringify({
    text: options.text,
    fallback: options.fallback,
    color: options.color,
    title: options.title,
    title_link: options.title_link,
    callback_id: options.callback_id,
    attachment_type: options.attachment_type,
    actions: options.actions
  }))
}

export function buildMessage(options) {
  return JSON.parse(JSON.stringify({
    text: options.text,
    channel: options.channel,
    attachments: options.attachments,
    response_type: options.response_type,
    replace_original: options.replace_original,
    delete_original: options.delete_original
  }))
}

export function buildAction(options) {
  return JSON.parse(JSON.stringify({
    name: options.name,
    text: options.text,
    style: options.style,
    type: options.type,
    value: options.value,
    confirm: options.confirmation
  }))
}
