//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_update_profile_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserUpdateProfileRequest {
  /// Returns a new [UserUpdateProfileRequest] instance.
  UserUpdateProfileRequest({

     this.name,
  });

  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserUpdateProfileRequest &&
      other.name == name;

    @override
    int get hashCode =>
        name.hashCode;

  factory UserUpdateProfileRequest.fromJson(Map<String, dynamic> json) => _$UserUpdateProfileRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UserUpdateProfileRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

