import store from '../';
import getMember from '../../utils/getMember';
import * as voluspa from '../../utils/voluspa';

const defaultState = {
  membershipType: false,
  membershipId: false,
  characterId: false,
  data: false,
  prevData: false,
  loading: false,
  stale: false,
  error: false
};

// Wrapper function for loadMember that lets it run asynchronously, but
// means we don't have to add `async` to our reducer (which is bad)
function loadMemberAndReset(membershipType, membershipId, characterId) {
  loadMember(membershipType, membershipId, characterId);

  return {
    membershipId,
    membershipType,
    characterId: characterId || null,
    data: false,
    prevData: false,
    loading: true,
    error: false,
    stale: false
  };
}

async function loadMember(membershipType, membershipId, characterId) {
  // Note: while calling store.dispatch from within a reducer is an anti-pattern,
  // calling one asynchronously (eg as a result of a fetch) is just fine.
  
  try {
    const data = await getMember(membershipType, membershipId);

    // Required data is private/unavailable -> return error
    if (data.profile && data.profile.ErrorCode === 1 && !data.profile.Response.profileProgression.data) {
      store.dispatch({ type: 'MEMBER_LOAD_ERROR', payload: { membershipId, membershipType, error: { ErrorCode: 'private' } } });

      return;
    }

    // console.log('member reducer', data);

    ['profile', 'groups'].forEach(key => {
      
      if (!data[key].ErrorCode || data[key].ErrorCode !== 1) {
        
        store.dispatch({ type: 'MEMBER_LOAD_ERROR', payload: { membershipId, membershipType, error: { ...data[key] } } });

        if (data[key].ErrorCode) {
          throw {
            ...data[key]
          }
        } else {
          throw Error('BUNGIE');
        }
      }
    });

    // Requested characterId was not found -> maybe it's been deleted
    if (data.profile && characterId && !data.profile.Response.characters.data.filter(c => c.characterId === characterId).length) {
      store.dispatch({
        type: 'MEMBER_LOAD_ERROR',
        payload: {
          membershipId,
          membershipType,
          characterId: data.profile.Response.characters.data.length && data.profile.Response.characters.data[0].characterId ? data.profile.Response.characters.data[0].characterId : false,
          data: {
            profile: data.profile.Response,
            groups: data.groups.Response,
            milestones: data.milestones.Response
          },
          error: {
            ErrorCode: 'character_unavailable',
            recoverable: true
          }
        }
      });

      return;
    }

    store.dispatch({
      type: 'MEMBER_LOADED',
      payload: {
        membershipId,
        membershipType,
        characterId,
        data: {
          profile: data.profile.Response,
          groups: data.groups.Response,
          milestones: data.milestones.Response
        }
      }
    });

    voluspa.PostMember({ membershipId, membershipType });

  } catch (error) {

    store.dispatch({ type: 'MEMBER_LOAD_ERROR', payload: { membershipId, membershipType, error } });
    
    return;
  }
}

export default function memberReducer(state = defaultState, action) {
  const now = new Date().getTime();
  
  // if (process.env.NODE_ENV === 'development') console.log(action);

  if (!action.payload) return state;

  const { membershipId, characterId, data, error } = action.payload;

  // Sometimes a number - let's just make it a string all the time
  const membershipType = action.payload.membershipType && action.payload.membershipType.toString();

  if (action.type === 'MEMBER_SET_BY_PROFILE_ROUTE' || action.type === 'MEMBER_SET_CHARACTERID') {
    const membershipLoadNeeded = (!state.data && !state.loading) || state.membershipId !== membershipId || state.membershipType !== membershipType;

    // If our data doesn't exist and isn't currently loading, or if our
    // new membership ID / type doesn't match what we already have stored,
    // reset everything and trigger a reload.
    if (membershipLoadNeeded) return loadMemberAndReset(membershipType, membershipId, characterId);

    // Otherwise, make sure the character ID is in sync with what we're being
    // told by the profile route. In most cases this will be a no-op.
    // if (state.characterId !== characterId) console.log('Updating characterId');
    return { ...state, characterId, error: false };
  }

  if (action.type === 'MEMBER_LOAD_MEMBERSHIP') {
    return loadMemberAndReset(membershipType, membershipId, characterId);
  }

  // We send the membership type & membership ID along with all member
  // dispatches to make sure that multiple async actions on different members
  // don't stomp on each other - eg a user searches for one member, clicks it, then
  // searches for another and clicks it before the first is finished loading.
  const membershipMatches = membershipType === state.membershipType && membershipId === state.membershipId;
  if (!membershipMatches) {
    // console.warn(action.payload);
    return state;
  }

  switch (action.type) {
    case 'MEMBER_CHARACTER_SELECT':
      return {
        ...state,
        characterId,
        error: false
      };
    case 'MEMBER_LOAD_ERROR':
      return {
        ...state,
        characterId,
        data,
        loading: false,
        error
      };
    case 'MEMBER_LOADED':
      return {
        ...state,
        characterId: state.characterId ? state.characterId : data.profile.characters.data.length && data.profile.characters.data[0].characterId ? data.profile.characters.data[0].characterId : false,
        data: { ...state.data, ...data },
        prevData: state.data,
        loading: false,
        stale: false,
        updated: now
      };
    case 'MEMBER_LOADING':
      return {
        ...state,
        loading: true
      };
    case 'MEMBER_IS_STALE':
      return {
        ...state,
        stale: true
      };
    default:
      return state;
  }
}
