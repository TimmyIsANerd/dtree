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
      profileNode: userProfile._id,
    };
    cache[uid] = profile; // Update the cache
    return profile;
  } catch (error) {
    console.error(error);
  }
}

async function getUserExpanded(uid) {
  let endpoint = "https://inalife.com/version-test/api/1.1/obj/userexpanded";
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
    const { response: familyData } = data;

    return familyData;
  } catch (error) {
    console.error(error);
  }
}

async function getFamilyInfo(familyUid) {
  let endpoint = "https://inalife.com/version-test/api/1.1/obj/familymember";
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

    return familyData;
  } catch (error) {
    console.error(error);
  }
}

async function collectInfo(uid) {
  const userProfile = await getUserProfile(uid);
  const userExpanded = await getUserExpanded(userProfile.userExpandedUid);
  const familyMembers = userExpanded.family_tree_list_custom_new_family;

  const membersList = await Promise.all(
    familyMembers.map(async (member) => {
      const user = await getFamilyInfo(member);
      const userProfile = await getUserProfile(user.user_user);

      return {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        profilePicture: userProfile.profilePicture,
        profileNode: userProfile.profileNode,
        previousNode: user.node_user,
        relationship_toNode: user.node_relationship_option_node_relation,
        relationship_toNodeDescription: user.relationship_option_relationship,
      };
    })
  );

  // Check for Father
  const father = membersList.find(
    (member) => member.relationship_toNodeDescription === "Father"
  );

  // Check for Grandfather
  const grandFather = membersList.find(
    (member) =>
      member.previousNode === father.profileNode &&
      member.relationship_toNodeDescription.includes("Grand")
  );

  let data = [
    {
      ...userProfile,
      previousNode: grandFather ? grandFather.profileNode : father.profileNode,
      relationship_toNode: "father",
      relationship_toNodeDescription: "Child",
      currentUser: true,
    },
    ...membersList,
  ];

  return data;
}

const generateFamilyTree = (familyData) => {
  const oldestRelationship = familyData.find(
    (member) => familyData[0].previousNode === member.profileNode
  );

  const tree = {
    firstName: oldestRelationship.firstName,
    lastName: oldestRelationship.lastName,
    profilePicture: oldestRelationship.profilePicture,
    profileNode: oldestRelationship.profileNode,
    children: [],
    spouse: [],
  };

  // Remove oldest relationship from family members
  const familyMembers = familyData.filter(
    (member) => member.profileNode !== oldestRelationship.profileNode
  );

  function findChildNode(node) {
    const child = familyMembers.find(
      (member) => member.previousNode === node.profileNode
    );

    return child;
  }

  // Sort Out Family
  familyMembers.forEach((member) => {
    // Check if they have spouse
    if (
      member.relationship_toNode === "spouse" &&
      member.previousNode === oldestRelationship.profileNode
    ) {
      const spouse = {
        firstName: member.firstName,
        lastName: member.lastName,
        profilePicture: member.profilePicture,
        profileNode: member.profileNode,
      };

      tree.spouse.push(spouse);
      return;
    }

    const child = findChildNode(member);

    if (child) {
      const node = {
        firstName: member.firstName,
        profilePicture: member.profilePicture,
        profileNode: member.profileNode,
        children: [],
        spouse: [],
      };

      tree.children.push(node);
    }

  });

  return tree;
};

(async () => {
  const uid = "1685834905941x455958100823927940";
  const familyData = await collectInfo(uid);
  const tree = generateFamilyTree(familyData);
  console.log(tree);
})();
