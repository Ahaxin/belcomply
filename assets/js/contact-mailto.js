(() => {
  for (const form of document.querySelectorAll('form[data-contact-mailto]')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const zh = document.documentElement.lang.toLowerCase().startsWith('zh');
      const labels = zh
        ? { name: '姓名', email: '邮箱', company: '公司', model: '销售渠道', message: '留言' }
        : { name: 'Name', email: 'Email', company: 'Company', model: 'Sales channel', message: 'Message' };
      const lines = Object.entries(labels).map(([key, label]) =>
        `${label}: ${String(data.get(key) || '').trim().slice(0, key === 'message' ? 2000 : 200)}`
      );
      const subject = zh ? 'BelComply 咨询' : 'BelComply enquiry';
      const href = `mailto:info@belcomply.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n\n'))}`;
      const status = form.querySelector('[data-contact-status]');
      if (status) {
        status.textContent = zh
          ? '请在打开的邮件草稿中点击“发送”。如果没有打开邮件应用，请直接发邮件至 info@belcomply.com。'
          : 'Please press Send in the email draft that opens. If no email app opens, write directly to info@belcomply.com.';
      }
      window.location.href = href;
    });
  }
})();
