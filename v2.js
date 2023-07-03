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
    const profile = {
      firstName: userProfile.first_name_text,
      lastName: userProfile.last_name_text,
      profilePicture: userProfile.profile_picture_image,
      userExpandedUid: userProfile.user_expanded_custom_user_expanded,
    };
    cache[uid] = profile; // Update the cache
    console.log(
      `Profile ${profile.firstName} ${profile.lastName}, Expanded ID: ${profile.userExpandedUid}`
    );
    return profile;
  } catch (error) {
    console.error(error);
  }
}

async function getUserExpanded(familyUid) {
  let endpoint = "https://inalife.com/version-test/api/1.1/obj/userexpanded";
  const bearer = "fc6a6a9f4a097672d8dc3152d7c4bea0";

  if(familyUid === undefined) {
    return {
      children: [],
      parents: [],
      spouses: [],
    };
  }

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

    console.log("Family Data", familyData);

    return {
      children: familyData.children_list_user || [],
      parents: familyData.parents_list_user || [],
      spouses: familyData.spouses_list_user || [],
    };
  } catch (error) {
    console.error(error);
  }
}

const generateFamilyTree = async (uid, processed = new Set()) => {
  if (processed.has(uid)) {
    return null;
  }

  processed.add(uid);

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

  const childPromises = familyInfo.children.map(async (childUid) => {
    const childTree = await generateFamilyTree(childUid, processed);
    if (childTree) {
      tree.children.push(childTree);
    }
  });
  await Promise.all(childPromises);

  const parentPromises = familyInfo.parents.map(async (parentUid) => {
    const parentTree = await generateFamilyTree(parentUid, processed);
    if (parentTree) {
      tree.parents.push(parentTree);
    }
  });
  await Promise.all(parentPromises);

  const spousePromises = familyInfo.spouses.map(async (spouseUid) => {
    const spouseTree = await generateFamilyTree(spouseUid, processed);
    if (spouseTree) {
      tree.spouses.push(spouseTree);
    }
  });
  await Promise.all(spousePromises);

  return tree;
};

function renderFamilyTree(tree) {
  const container = document.createElement("div");
  container.classList.add("family-tree");

  const profile = createProfileElement(tree);
  container.appendChild(profile);

  if (tree.children.length > 0) {
    const childrenContainer = document.createElement("div");
    childrenContainer.classList.add("children");

    tree.children.forEach((child) => {
      const childContainer = renderFamilyTree(child);
      childrenContainer.appendChild(childContainer);

      const relationBar = document.createElement("div");
      relationBar.classList.add("relation-bar");
      childContainer.appendChild(relationBar);
    });

    container.appendChild(childrenContainer);
  }

  if (tree.parents.length > 0) {
    const parentsContainer = document.createElement("div");
    parentsContainer.classList.add("parents");

    tree.parents.forEach((parent) => {
      const parentContainer = renderFamilyTree(parent);
      parentsContainer.appendChild(parentContainer);

      const relationBar = document.createElement("div");
      relationBar.classList.add("relation-bar");
      parentContainer.appendChild(relationBar);
    });

    container.appendChild(parentsContainer);
  }

  if (tree.spouses.length > 0) {
    const spousesContainer = document.createElement("div");
    spousesContainer.classList.add("spouses");

    tree.spouses.forEach((spouse) => {
      const spouseContainer = renderFamilyTree(spouse);
      spousesContainer.appendChild(spouseContainer);

      const relationBar = document.createElement("div");
      relationBar.classList.add("relation-bar");
      spouseContainer.appendChild(relationBar);
    });

    container.appendChild(spousesContainer);
  }

  return container;
}

function createProfileElement(person) {
  const profile = document.createElement("div");
  profile.classList.add("profile");

  const picture = document.createElement("img");
  picture.src = person.profilePicture;
  profile.appendChild(picture);

  const name = document.createElement("div");
  name.textContent = person.firstName + " " + person.lastName;
  profile.appendChild(name);

  return profile;
}

const cssStyles = `
.family-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 16px;
  position: relative;
  cursor: pointer;
}

.profile img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin: 10px 0;
  border: 3px solid #f5181f;
}

.relation-bar {
  position: absolute;
  bottom: -8px;
  width: 2px;
  background-color: black;
  z-index: -1;
}

.children {
  display: flex;
  justify-content: center;
  position: relative;
}

.children .profile:not(:last-child) .relation-bar {
  height: calc(50% + 8px);
}

.parents {
  display: flex;
  justify-content: center;
  position: relative;
}

.parents .profile:not(:last-child) .relation-bar {
  height: calc(50% + 8px);
}

.spouses {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.spouses .profile:not(:last-child) .relation-bar {
  height: 50%;
}

.relation-bar::after {
  content: "";
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: black;
  position: absolute;
  bottom: -5px;
  left: -4px;
}

.children .profile:not(:last-child) .relation-bar::after,
.parents .profile:not(:last-child) .relation-bar::after {
  top: -5px;
  bottom: unset;
}

.spouses .profile:not(:last-child) .relation-bar::after {
  top: calc(50% - 5px);
}


`;

(async () => {
  const uid = "1685834905941x455958100823927940";
  const familyTree = await generateFamilyTree(uid);
  const treeContainer = document.getElementById("tree-container");
  const familyTreeElement = renderFamilyTree(familyTree);
  treeContainer.appendChild(familyTreeElement);

  const styleElement = document.createElement("style");
  styleElement.textContent = cssStyles;
  document.head.appendChild(styleElement);
})();
