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
      relationship_toNode: "parent",
      relationship_toNodeDescription: "You",
      currentUser: true,
    },
    ...membersList,
  ];

  data.map((item, index) => {
    item.id = index + 1;
    return item;
  });

  return data;
}

function transformData(array) {
  const transformedData = [];

  function findNode(profileNode) {
    return array.find((item) => item.profileNode === profileNode);
  }

  array.forEach((item) => {
    const transformedItem = {
      id: item.id,
      pid: "",
      fid: "",
      mid: "",
      gender: "",
      title: "",
      name: `${item.firstName} ${item.lastName}`,
      photo: item.profilePicture || "",
      addr: "",
      cn: "",
    };

    if (item.relationship_toNode === "parent") {
      transformedItem.gender = "male";
      transformedItem.title = item.relationship_toNodeDescription;
      transformedItem.addr = "";
      transformedItem.cn = "";
      transformedItem.fid = findNode(item.previousNode).id;
      transformedItem.addr = "";
      transformedItem.cn = "";
    }

    if (item.relationship_toNode === "spouse") {
      transformedItem.gender = "female";
      transformedItem.title = item.relationship_toNodeDescription;
      transformedItem.addr = "";
      transformedItem.cn = "";
      transformedItem.pid = findNode(item.previousNode).id;
      transformedItem.addr = "";
      transformedItem.cn = "";
    }

    if (item.relationship_toNode === "child") {
      transformedItem.gender =
        item.relationship_toNodeDescription === "Daughter" ? "female" : "male";
      transformedItem.title = item.relationship_toNodeDescription;
      transformedItem.addr = "";
      transformedItem.cn = "";
      transformedItem.fid = findNode(item.previousNode).id;
      transformedItem.addr = "";
      transformedItem.cn = "";
    }

    if (transformedItem.pid === "") {
      delete transformedItem.pid;
    }

    if (transformedItem.fid === "") {
      delete transformedItem.fid;
    }

    if (transformedItem.mid === "") {
      delete transformedItem.mid;
    }

    transformedData.push(transformedItem);
  });

  return transformedData;
}

(async () => {
  const uid = "1685834905941x455958100823927940";
  const familyData = await collectInfo(uid);
  // Usage example
  const data = transformData(familyData);
  let family = JSON.stringify(data);
  console.log(family);

  // var params = {
  //   data: family /*Local variable or file path*/,
  //   search: false, //false
  //   container: "test",
  //   template: "circle", // "rounded" // "raised" // "tilted"
  // };
  
  // var tree = new Lineage(params);
  // tree.load();
})();
