//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'studentclass_user_ref.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class StudentclassUserRef {
  /// Returns a new [StudentclassUserRef] instance.
  StudentclassUserRef({

     this.id,

     this.name,
  });

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





    @override
    bool operator ==(Object other) => identical(this, other) || other is StudentclassUserRef &&
      other.id == id &&
      other.name == name;

    @override
    int get hashCode =>
        id.hashCode +
        name.hashCode;

  factory StudentclassUserRef.fromJson(Map<String, dynamic> json) => _$StudentclassUserRefFromJson(json);

  Map<String, dynamic> toJson() => _$StudentclassUserRefToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

