import { useEffect, useRef, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../lib/api';

export function SettingsPage({ active }: { active: boolean }) {
  const { isOwner } = useSession();
  const { profile, setProfile } = useProfile();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    age: '',
    job: '',
    intro: '',
    miniLike: '',
    miniColor: '',
    miniMood: '',
    bannerTitle: '',
    bannerSubtitle: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      name: profile.name ?? '',
      age: profile.age ?? '',
      job: profile.job ?? '',
      intro: profile.intro ?? '',
      miniLike: profile.miniLike ?? '',
      miniColor: profile.miniColor ?? '',
      miniMood: profile.miniMood ?? '',
      bannerTitle: profile.bannerTitle ?? '',
      bannerSubtitle: profile.bannerSubtitle ?? '',
    });
  }, [profile]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!isOwner) return;
    const updated = await api.profile.update(form);
    setProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isOwner) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const updated = await api.profile.uploadPhoto(file);
    setProfile(updated);
    e.target.value = '';
  }

  return (
    <div className={`page${active ? ' active' : ''}`}>
      <div className="settings-form">
        <h3>ⓘ 프로필 설정</h3>

        <div className="settings-body">
          {!isOwner && (
            <p className="settings-locked-msg">
              ⚠ 주인장모드로 로그인해야 설정을 바꿀 수 있어요. 하단의 "주인장모드 로그인" 버튼을 눌러주세요.
            </p>
          )}

          <div className="settings-photo-row">
            <div
              className={`settings-photo${!isOwner ? ' locked' : ''}`}
              title="클릭해서 사진 바꾸기"
              onClick={() => isOwner && photoInputRef.current?.click()}
            >
              {profile.photoUrl ? (
                <img className="has-photo" src={profile.photoUrl} alt="프로필 사진 미리보기" />
              ) : (
                <span>＋</span>
              )}
            </div>
            <button
              type="button"
              className="settings-photo-btn"
              disabled={!isOwner}
              onClick={() => photoInputRef.current?.click()}
            >
              갤러리에서 사진 선택
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPhotoChange}
            />
          </div>

          <div className="form-row">
            <label htmlFor="setName">이름</label>
            <input
              id="setName"
              type="text"
              placeholder="이름을 입력하세요"
              disabled={!isOwner}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="setAge">나이</label>
            <input
              id="setAge"
              type="text"
              placeholder="나이"
              disabled={!isOwner}
              value={form.age}
              onChange={(e) => set('age', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="setJob">직업/신분</label>
            <input
              id="setJob"
              type="text"
              placeholder="직업/신분"
              disabled={!isOwner}
              value={form.job}
              onChange={(e) => set('job', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="setIntro">한줄소개</label>
            <textarea
              id="setIntro"
              placeholder="한줄소개를 적어보세요"
              disabled={!isOwner}
              value={form.intro}
              onChange={(e) => set('intro', e.target.value)}
            />
          </div>

          <h3 className="second">★ 배너 문구 설정</h3>

          <div className="form-row">
            <label htmlFor="setBannerTitle">배너 제목</label>
            <input
              id="setBannerTitle"
              type="text"
              placeholder="여기는 OOO의 미니홈피"
              disabled={!isOwner}
              value={form.bannerTitle}
              onChange={(e) => set('bannerTitle', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="setBannerSubtitle">배너 문구</label>
            <input
              id="setBannerSubtitle"
              type="text"
              placeholder="놀러와줘서 고마워요! 방명록 남기고 가요"
              disabled={!isOwner}
              value={form.bannerSubtitle}
              onChange={(e) => set('bannerSubtitle', e.target.value)}
            />
          </div>

          <h3 className="second">★ 미니 정보 설정</h3>

          <div className="form-row">
            <label htmlFor="setLike">좋아하는 것</label>
            <input
              id="setLike"
              type="text"
              placeholder="좋아하는 것"
              disabled={!isOwner}
              value={form.miniLike}
              onChange={(e) => set('miniLike', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="setColor">좋아하는 색</label>
            <input
              id="setColor"
              type="text"
              placeholder="좋아하는 색"
              disabled={!isOwner}
              value={form.miniColor}
              onChange={(e) => set('miniColor', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="setMood">기분</label>
            <input
              id="setMood"
              type="text"
              placeholder="기분"
              disabled={!isOwner}
              value={form.miniMood}
              onChange={(e) => set('miniMood', e.target.value)}
            />
          </div>

          <button type="button" className="settings-save-btn" disabled={!isOwner} onClick={save}>
            저장하기
          </button>
          {saved && <p className="settings-saved-msg">✓ 저장됐어요</p>}
        </div>
      </div>
    </div>
  );
}
