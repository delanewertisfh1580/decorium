const STATUS_COPY = Object.freeze({
  restored: 'Локальный профиль восстановлен',
  created: 'Создан новый локальный профиль',
  migrated: 'Профиль обновлён до текущей версии',
  recovered: 'Профиль восстановлен после проверки данных'
});

export class ProfileStatusView {
  constructor(container) {
    if (!container) throw new Error('ProfileStatusView: container is required.');
    this.container = container;
  }

  render({ status, profile }) {
    if (!STATUS_COPY[status]) {
      throw new Error(`Unknown profile status: ${status}`);
    }
    if (!profile) {
      throw new Error('ProfileStatusView: profile is required.');
    }

    this.container.innerHTML = `
      <p class="profile-status" data-profile-status data-profile-state="${status}" aria-live="polite">
        ${STATUS_COPY[status]}
      </p>
    `;
  }
}

export default ProfileStatusView;
