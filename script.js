const cache = {};

async function getUserProfile(uid) {
  if (cache[uid]) {
    return cache[uid];
  }
  const endpoint = "https://inalife.com/version-test/api/1.1/obj/user";
  const bearer = "fc6a6a9f4a097672d8dc3152d7c4bea0";

  try {
    const res = await fetch(`${endpoint}/${uid}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const data = await res.json();
    const { response: userProfile } = data;
    return {
      firstName: userProfile.first_name_text,
      lastName: userProfile.last_name_text,
      profilePicture: userProfile.profile_picture,
      userExpandedUid: userProfile.user_expanded_custom_user_expanded,
    };
  } catch (error) {
    console.error(error);
  }
}

async function getUserExpanded(familyUid) {
  let endpoint = "https://inalife.com/version-test/api/1.1/obj/userexpanded/";
  const bearer = "fc6a6a9f4a097672d8dc3152d7c4bea0";

  try {
    const res = await fetch(`${endpoint}/${familyUid}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const data = await res.json();
    const { response: familyData } = data;
    return {
      children: familyData.children_list_user,
      parents: familyData.parents_list_user,
      spouses: familyData.spouses_list_user,
    };
  } catch (error) {
    console.error(error);
  }
}

const generateFamilyTree = async (uid) => {
  const userProfile = await getUserProfile(uid);
  const familyInfo = await getUserExpanded(userProfile.userExpandedUid);

  const tree = {
    uid,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    profilePicture: userProfile.profilePicture,
    children: [],
    parents: [],
    spouses: [],
  };

  for (const childUid of familyInfo.children) {
    const childTree = await generateFamilyTree(childUid);
    tree.children.push(childTree);
  }

  for (const parentUid of familyInfo.parents) {
    const parentTree = await generateFamilyTree(parentUid);
    tree.parents.push(parentTree);
  }

  for (const spouseUid of familyInfo.spouses) {
    const spouseTree = await generateFamilyTree(spouseUid);
    tree.spouses.push(spouseTree);
  }

  return tree;
};

(async () => {
  const uid = "1685834905941x455958100823927940";
  const familyTree = await generateFamilyTree(uid);
  console.log(familyTree)
})();
