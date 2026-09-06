import { useProfile } from '../../context/ProfileContext';
import { Highlight, useSearchable } from '../common/Highlight';

const DEFAULTS = {
  name: '이름을 입력하세요',
  age: '나이',
  job: '직업/신분',
  intro: '한줄소개를 적어보세요',
  miniLike: '여기에 취미',
  miniColor: '핑크',
  miniMood: '오늘도 좋음 :)',
};

export function ProfilePage({ active }: { active: boolean }) {
  const { profile } = useProfile();

  const name = profile.name || DEFAULTS.name;
  const age = profile.age || DEFAULTS.age;
  const job = profile.job || DEFAULTS.job;
  const intro = profile.intro || DEFAULTS.intro;
  const miniLike = profile.miniLike || DEFAULTS.miniLike;
  const miniColor = profile.miniColor || DEFAULTS.miniColor;
  const miniMood = profile.miniMood || DEFAULTS.miniMood;

  useSearchable('profile-name', 'profile', name);
  useSearchable('profile-age', 'profile', age);
  useSearchable('profile-job', 'profile', job);
  useSearchable('profile-intro', 'profile', intro);
  useSearchable('profile-mini-like', 'profile', miniLike);
  useSearchable('profile-mini-color', 'profile', miniColor);
  useSearchable('profile-mini-mood', 'profile', miniMood);

  return (
    <div className={`page${active ? ' active' : ''}`}>
      <div className="profile-card">
        <div className="photo-wrap">
          <span className="sticker s1">★</span>
          <span className="sticker s2">♥</span>
          <span className="sticker s3">✦</span>
          <span className="sticker s4">♦</span>
          <span className="sticker s5">✧</span>
          <div className="profile-photo">
            {profile.photoUrl ? <img src={profile.photoUrl} alt="프로필 사진" /> : <span>＋</span>}
          </div>
        </div>

        <h2>
          <Highlight id="profile-name" text={name} />
        </h2>
        <p className="profile-meta">
          <span>
            <Highlight id="profile-age" text={age} />
          </span>{' '}
          ·{' '}
          <span>
            <Highlight id="profile-job" text={job} />
          </span>
        </p>
        <p className="profile-intro">
          <Highlight id="profile-intro" text={intro} />
        </p>
      </div>

      <div className="mini-box">
        <h3>ⓘ 미니 정보</h3>
        <ul>
          <li>
            좋아하는 것: <Highlight id="profile-mini-like" text={miniLike} />
          </li>
          <li>
            좋아하는 색: <Highlight id="profile-mini-color" text={miniColor} />
          </li>
          <li>
            기분: <Highlight id="profile-mini-mood" text={miniMood} />
          </li>
        </ul>
      </div>
    </div>
  );
}
