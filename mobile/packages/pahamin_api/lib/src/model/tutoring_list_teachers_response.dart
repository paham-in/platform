//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/tutoring_subject_info.dart';
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_list_teachers_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringListTeachersResponse {
  /// Returns a new [TutoringListTeachersResponse] instance.
  TutoringListTeachersResponse({

     this.avatarUrl,

     this.email,

     this.id,

     this.name,

     this.subjects,
  });

  @JsonKey(
    
    name: r'avatar_url',
    required: false,
    includeIfNull: false,
  )


  final String? avatarUrl;



  @JsonKey(
    
    name: r'email',
    required: false,
    includeIfNull: false,
  )


  final String? email;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'subjects',
    required: false,
    includeIfNull: false,
  )


  final List<TutoringSubjectInfo>? subjects;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringListTeachersResponse &&
      other.avatarUrl == avatarUrl &&
      other.email == email &&
      other.id == id &&
      other.name == name &&
      other.subjects == subjects;

    @override
    int get hashCode =>
        avatarUrl.hashCode +
        email.hashCode +
        id.hashCode +
        name.hashCode +
        subjects.hashCode;

  factory TutoringListTeachersResponse.fromJson(Map<String, dynamic> json) => _$TutoringListTeachersResponseFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringListTeachersResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

