import React from 'react';

const ProfileForm: React.FC = () => {
  return (
    <form className="space-y-6">
      <div className="flex items-center gap-6">
        <img
          src="https://i.pravatar.cc/150?u=abbaszein"
          alt="User Profile"
          className="w-24 h-24 rounded-full"
        />
        <div>
          <button type="button" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
            Change Photo
          </button>
          <p className="text-xs text-slate-400 mt-2">JPG, GIF or PNG. 1MB max.</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="fullName">
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          defaultValue="Abbas Zein"
          className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="email">
          Email
        </label>
        <input
          type="email"
          id="email"
          defaultValue="abbas.zein@example.com"
          disabled
          className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-400 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          rows={4}
          className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tell us a little about yourself"
        >
          This user hasn't added a bio yet.
        </textarea>
      </div>
      <div className="border-t border-slate-700/50 pt-6">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;